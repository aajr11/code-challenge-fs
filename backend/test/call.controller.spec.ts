import { Test, TestingModule } from "@nestjs/testing";
import { CallService } from "../src/application/services/call.service";
import { CallGateway } from "../src/infrastructure/websocket/event.gateway";
import { Call } from "@prisma/client";


describe("CallService", () => {
  let callService: CallService;
  let callGateway: CallGateway;

  beforeEach(async () => {
    const callRepositoryMock = {
      save: jest.fn(),
      findCalls: jest.fn(),
    };

    const callGatewayMock = {
      notifyClients: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallService,
        { provide: "CallRepository", useValue: callRepositoryMock },
        { provide: CallGateway, useValue: callGatewayMock },
      ],
    }).compile();

    callService = module.get<CallService>(CallService);
    callGateway = module.get<CallGateway>(CallGateway);
  });

  it("should be defined", () => {
    expect(callService).toBeDefined();
  });

  describe("createCall", () => {
    it("should create and save a call, then notify clients", async () => {
      const newCall: Call = {
        id: "123",
        status: "waiting",
        queue_id: "medical_spanish",
        start_time: new Date(),
        end_time: null,
        index: 0
      };

      await callService.createCall(newCall);

      expect(callGateway.notifyClients).toHaveBeenCalledWith(
        "call_created",
        newCall,
      );
    });
  });

  describe("getCalls", () => {
    it("should return all calls when no status is provided", async () => {
      const mockCalls: Call[] = [
        {
          id: "123",
          status: "waiting",
          queue_id: "medical_spanish",
          start_time: new Date(),
          end_time: null,
          index: 0
        },
        {
          id: "124",
          status: "active",
          queue_id: "tech_support",
          start_time: new Date(),
          end_time: null,
          index: 0
        },
      ];

      const result = await callService.getCalls();
      expect(result).toEqual(mockCalls);
    });

    it("should return filtered calls based on status", async () => {
      const mockCalls: Call[] = [
        {
          id: "123",
          status: "waiting",
          queue_id: "medical_spanish",
          start_time: new Date(),
          end_time: null,
          index: 0
        },
        {
          id: "124",
          status: "active",
          queue_id: "tech_support",
          start_time: new Date(),
          end_time: null,
          index: 0
        },
      ];
      const result = await callService.getCalls("waiting");
      expect(result).toEqual([mockCalls[0]]);
    });
  });
});
