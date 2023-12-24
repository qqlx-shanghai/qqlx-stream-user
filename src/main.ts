import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import {} from "qqlx-core";
import { toNumber, toString, toBoolean } from "qqlx-cdk";
import { getLocalNetworkIPs } from "qqlx-sdk";

import { TcpModule } from "./tcp/module";
import { TCP_PORT } from "./tcp/_";
import { RestModule } from "./rest/module";
import { REST_PORT } from "./rest/_";

async function bootstrap() {
    // 对内的微服务
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(TcpModule, {
        transport: Transport.TCP,
        options: { host: "0.0.0.0", port: TCP_PORT },
    });
    await microservice.listen();

    // 对外的 RESTful API
    const app = await NestFactory.create(RestModule);
    await app.listen(REST_PORT);

    // System tips
    console.log("\n---- ---- ---- main.ts @qqlx-droplet-host");
    const ips = getLocalNetworkIPs();
    for (const ip of ips) console.log(`${Object.values(ip).reverse().join(".")}`);
    console.log(`---- ---- ---- success on @tcp:${TCP_PORT} @http:${REST_PORT}`);
}
bootstrap();
