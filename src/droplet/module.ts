import { Module, Injectable } from "@nestjs/common";

import { PondDropletMessenger } from "qqlx-sdk";

@Module({
    providers: [PondDropletMessenger],
    exports: [PondDropletMessenger],
})
export class DropletModule { }
