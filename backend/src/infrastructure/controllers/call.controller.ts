import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { CallService } from "../../application/services/call.service";
import { CallListSchema } from "../../application/validator/call/call-list.validator";
import { Call } from "@prisma/client";

@Controller("calls")
export class CallController {
  constructor(private readonly callService: CallService) {}

  @Get()
  async getCalls(@Query("status") status?: string): Promise<Call[]> {
    CallListSchema.parse({ status });
    return this.callService.getCalls(status);
  }

  @Post()
  async createCall(@Body() data: Call) {
    this.callService.createCall(data);
  }
}
