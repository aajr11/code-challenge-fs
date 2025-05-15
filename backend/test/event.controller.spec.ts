import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from "../src/application/services/event.service";
import { CallGateway } from "../src/infrastructure/websocket/event.gateway";
import { CallService } from '../src/application/services/call.service';
import { Server } from "socket.io";

describe('EventsService', () => {
    let service: EventsService;
    let callService: CallService;
    let mockServer: Server;

    beforeEach(async () => {
        mockServer = { emit: jest.fn() } as any;

        const callRepositoryMock = {
            save: jest.fn(),
            findCalls: jest.fn(),
            findById: jest.fn(),
        };

        const callGatewayMock = {
            notifyClients: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EventsService,
                CallService,
                { provide: "CallRepository", useValue: callRepositoryMock },
                { provide: CallGateway, useValue: callGatewayMock },
            ],
        })
            .compile();

        callService = module.get<CallService>(CallService);
        service = module.get<EventsService>(EventsService);
        service['server'] = mockServer;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processEvent', () => {
        it('should process a valid event successfully', async () => {
            const event = { call_id: '1', event_type: 'call_initiated', metadata: {} };


            const result = await service.processEvent(event);

            expect(result).toBe(true);
            expect(mockServer.emit).toHaveBeenCalledWith('call_update', expect.anything());
        });

        it('should return false for an invalid event type', async () => {
            const event = { call_id: '1', event_type: 'invalid_event', metadata: {} };

            const result = await service.processEvent(event);

            expect(result).toBe(false);
            expect(mockServer.emit).not.toHaveBeenCalled();
        });

        it('should create a new call if the call_id does not exist', async () => {
            const event = { call_id: 'new_call', event_type: 'call_initiated', metadata: { queue_id: 'queue1' } };

            const result = await service.processEvent(event);

            expect(result).toBe(true);
        });
    });

    describe('eventHistory', () => {
        it('should return all events if no filters are applied', async () => {
            const history = await service.eventHistory();
            expect(history.eventHistory.length).toBe(2);
        });

        it('should return filtered events based on status', async () => {
            const history = await service.eventHistory('call_initiated');
            expect(history.eventHistory.length).toBe(1);
        });
    });
});
