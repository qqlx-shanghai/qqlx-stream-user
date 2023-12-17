import { Module, Injectable } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DropletLocation, SHANGHAI_POSTGRESQL_DROPLET, DROPLET_POND_USER } from "qqlx-core";
import { PondLogSchema } from "qqlx-cdk";
import { getLocalNetworkIPs, DropletLocationMessenger } from "qqlx-sdk";

import { DropletModule } from "../_/droplet.module";
import PondUserController from "./user.controller";

/** 相关解释
 * @imports 导入一个模块中 exports 的内容，放入公共资源池中
 * @providers 以及 inject，都是将公共资源池中的内容，放入应用池 controller 之中，所以其才能够使用/注入各种内容
 * @controllers 指明哪些应用需要被加载
 */
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [DropletModule],
            inject: [DropletLocationMessenger],
            useFactory: async (pondDropletMessenger: DropletLocationMessenger) => {
                const node_db = await pondDropletMessenger.get({ key: SHANGHAI_POSTGRESQL_DROPLET });
                const mess = node_db.droplet?.remark?.split(";") || [];
                const dbname = mess[0];
                const username = mess[1];
                const passwd = mess[2];

                console.log("\n---- ---- ---- tcp.module.ts");
                console.log(`droplet-location:get - ${SHANGHAI_POSTGRESQL_DROPLET}:${node_db.droplet?.lan_ip}:${node_db.droplet?.port}`);

                const ips = getLocalNetworkIPs();
                const droplet: DropletLocation = pondDropletMessenger.getSchema();
                droplet.lan_ip = ips[0].ip;
                droplet.port = 1003;
                pondDropletMessenger.keepAlive(DROPLET_POND_USER, droplet); // async
                console.log(`droplet-location:patch ing... - ${DROPLET_POND_USER}:${droplet.lan_ip}:${droplet.port}`);
                console.log("---- ---- ----\n");

                return {
                    type: "postgres",
                    host: node_db.droplet?.lan_ip,
                    port: node_db.droplet?.port,
                    username: username,
                    password: passwd,
                    database: dbname,
                    logging: false,
                    entities: [PondLogSchema],
                };
            },
        }),
        TypeOrmModule.forFeature([PondLogSchema]),
    ],
    providers: [],
    controllers: [PondUserController],
})
export class TcpModule {}
