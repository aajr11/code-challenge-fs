import { Inject, Injectable } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { v4 } from "uuid";
import { PrismaService } from "../../prisma/prisma.service";
import { CallEvent, Prisma } from "@prisma/client";

@Injectable()
@WebSocketGateway()
export class EventsService {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private prisma : PrismaService
  ) { }

  private readonly validEvents = [
    "call_initiated",
    "call_routed",
    "call_answered",
    "call_hold",
    "call_ended",
    "call_retransfer",
  ];

  async processEvent(event: any): Promise<boolean> {
    if (!this.server) {
      console.warn("WebSocket no iniciado.");
      return false;
    }
    console.log(event);
    const { call_id, event_type, ...metadata } = event;

    if (!this.validEvents.includes(event_type)) {
      console.warn(`Evento inválido recibido: ${event_type}`);
      return false;
    }

    let call = await this.prisma.call.findFirst({
      where:{
        id:call_id
      }
    });
    console.log(call);
    if (!call) {
      console.warn(`call_id no encontrado: ${call_id}, iniciando llamada.`);
      call = { 
        index: 0,
        id: call_id, 
        status: "waiting", 
        queue_id: metadata.queue_id, 
        start_time: new Date(),
        end_time:null
      };
      await this.prisma.call.create({
        data:call
      });
    }

    switch (event_type) {
      case "call_initiated":
        if (call.status === "waiting") {
          call.status = "initiated";
          setTimeout(async()=>{
            this.server.emit("call_update",call);
            this.server.emit("call_pass",call);
          },30000)
        }
        break;
      
      case "call_routed":
        if (call.status === "initiated") {
          call.status = "routed";
          setTimeout(async()=>{
            this.server.emit("call_update",call);
            this.server.emit("call_pass",call);
          },15000)
        }
        break;

      case "call_answered":
        if (call.status === "routed") {
          call.status = "active";
          setTimeout(async()=>{
            this.server.emit("call_update",call);
            this.server.emit("call_pass",call);
          },10000)
        }
        break;

      case "call_hold":
        if (call.status === "active") {
          call.status = "on_hold";
          setTimeout(async()=>{
            this.server.emit("call_update",call);
            this.server.emit("call_pass",call);
          },10000)
        }
        break;

      case "call_ended":
        if (call.status === "active" || call.status === "on_hold") {
          call.status = "ended";
          call.end_time = new Date();
        }
        break;

    }
    call.queue_id = event_type;

    await Promise.all([
      this.prisma.call.update({
        where:{
          index:call.index
        },
        data:call
      }),
      this.prisma.callEvent.create({
        data:{
          id: v4(),
          call_id,
          type:event_type,
          timestamp:new Date(),
          metadata: JSON.stringify(metadata),
        }
      }),
    ]);
    this.server.emit("call_update", call);
    return true;
  }

  async eventHistory(status?: string, call_id?: string) {
    const eventHistory = await this.prisma.callEvent.findMany({
      where:{
        call_id,
        type:status
      }
    });
    console.log("Fetched event history:", eventHistory);

    if (!eventHistory || eventHistory.length === 0) {
      console.log("No events found.");
    }

    return {
      eventHistory
    }
  }

}
