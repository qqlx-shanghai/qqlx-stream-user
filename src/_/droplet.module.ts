import { Module, Injectable } from "@nestjs/common";

import { DropletHostMessenger } from "qqlx-sdk";

@Module({
    providers: [DropletHostMessenger],
    exports: [DropletHostMessenger],
})
export class DropletModule { }
