-- CreateTable
CREATE TABLE "Call" (
    "index" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "queue_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),

    CONSTRAINT "Call_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "index" SERIAL NOT NULL,
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("index")
);
