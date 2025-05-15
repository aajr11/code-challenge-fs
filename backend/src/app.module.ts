import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CallService } from "./application/services/call.service";
import { CallController } from "./infrastructure/controllers/call.controller";
import { EventsController } from "./infrastructure/controllers/event.controller";
import { EventsService } from "./application/services/event.service";
import { ConfigModule } from "@nestjs/config";
import { CallGateway } from "./infrastructure/websocket/event.gateway";
import { ApiKeyMiddleware } from "./application/middleware/api-key.middleware";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule
  ],
  controllers: [CallController, EventsController],
  providers: [
    EventsService,
    CallGateway,
    CallService,
  ],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes(EventsController);
  }
}
