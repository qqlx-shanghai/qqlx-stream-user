import { Module, Injectable } from "@nestjs/common";

import { DropletLocationMessenger } from "qqlx-sdk";

@Module({
    providers: [DropletLocationMessenger],
    exports: [DropletLocationMessenger],
})
export class DropletModule {}
