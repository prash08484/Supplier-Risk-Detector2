-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Unknown Supplier',
    "riskScore" TEXT NOT NULL DEFAULT '0',
    "summary" TEXT NOT NULL DEFAULT '',
    "flags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "analysisData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatLog" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_url_key" ON "Supplier"("url");

-- CreateIndex
CREATE INDEX "ChatLog_url_idx" ON "ChatLog"("url");

-- AddForeignKey
ALTER TABLE "ChatLog" ADD CONSTRAINT "ChatLog_url_fkey" FOREIGN KEY ("url") REFERENCES "Supplier"("url") ON DELETE CASCADE ON UPDATE CASCADE;
