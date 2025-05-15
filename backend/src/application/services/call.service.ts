import { Inject, Injectable } from "@nestjs/common";
import { CallGateway } from "../../infrastructure/websocket/event.gateway";
import { PrismaService } from "../../prisma/prisma.service";
import { Call } from "@prisma/client";

@Injectable()
export class CallService {
  constructor(
    private prisma: PrismaService,
    private readonly callGateway: CallGateway,
  ) {}

  async createCall(call: Call): Promise<void> {
    call.status = "waiting";
    const llamada = await this.prisma.call.create({
      data:call
    });
    this.callGateway.notifyClients("call_initiated", llamada);
    console.info("Registro creado exitosamente");
  }

  async getCalls(status?: string): Promise<Call[]> {
    return this.prisma.call.findMany({
      where:{
        status
      }
    });
  }
}
