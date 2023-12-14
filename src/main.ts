import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";

import {} from "qqlx-core";
import { toNumber, toString, toBoolean } from "qqlx-cdk";
import { getLocalNetworkIPs } from "qqlx-sdk";

import { AppModule } from "./app.module";

async function bootstrap() {
    console.log("\n---- ---- ----");
    const ips = getLocalNetworkIPs();
    console.log(ips);

    const TCP_PORT = 1002;
    const HTTP_PORT = 2002;

    // 对内的微服务
    const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.TCP,
        options: { host: "0.0.0.0", port: TCP_PORT },
    });
    await microservice.listen();
    console.log(`qqlx-pond-log tcp is: ${TCP_PORT}`);

    // 对外的 RESTful API
    const app = await NestFactory.create(AppModule);
    await app.listen(HTTP_PORT);

    console.log(`qqlx-pond-log http is: ${HTTP_PORT}`);
    console.log("---- ---- ---- \n");
}
bootstrap();
