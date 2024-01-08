import { Module, Injectable } from "@nestjs/common";

import { DropletHostRpc } from "qqlx-sdk";

@Module({
    providers: [DropletHostRpc],
    exports: [DropletHostRpc],
})
export class DropletModule { }
