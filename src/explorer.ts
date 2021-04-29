/**
 * Copyright (C) 2021 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
 */

import compression from "compression";
import { Config } from "./config";
import createError from "http-errors";
import express, { Express, NextFunction, Request, Response } from "express";
import path from "path";
import http from "http";
import WebSocket from "ws";
import { Logger } from "./logger";

export class Explorer {
  private readonly config: Config;
  private readonly app: Express;
  private readonly httpServer: http.Server;
  private readonly webSocketServer: WebSocket.Server;

  constructor(config: Config) {
    this.config = config;

    this.app = express();
    // generic
    this.app.set("x-powered-by", false);

    // compression
    this.app.use(compression());

    // static content
    this.app.use(express.static(path.join(__dirname, "/../static/")));

    // view engine setup
    this.app.set("views", path.join(__dirname, "/../view/"));
    this.app.set("view engine", "pug");

    this.app.use(express.json());

    // routes
    this.app.use(Explorer.routes);

    // catch unavailable favicon.ico
    this.app.get("/favicon.ico", (req, res) => res.sendStatus(204));

    // catch 404 and forward to error handler
    this.app.use((req, res, next) => {
      next(createError(404));
    });

    // error handler
    this.app.use(Explorer.error);

    // Web Server
    this.httpServer = http.createServer(this.app);
    this.httpServer.on("listening", () => {
      Logger.info(`HttpServer listening on ${this.config.http_ip}:${this.config.http_port}`);
    });
    this.httpServer.on("close", () => {
      Logger.info(`HttpServer closing on ${this.config.http_ip}:${this.config.http_port}`);
    });

    this.webSocketServer = new WebSocket.Server({
      server: this.httpServer,
      perMessageDeflate: this.config.per_message_deflate,
    });
    this.webSocketServer.on("connection", (ws: WebSocket) => {
      //@FIXME logging
      Logger.trace("new websocket connection");
      ws.on("error", (error: Error) => {
        Logger.trace(error);
        ws.terminate();
      });
    });
    this.webSocketServer.on("close", () => {
      Logger.info("WebSocketServer closing");
    });
  }

  listen(): Explorer {
    this.httpServer.listen(this.config.http_port, this.config.http_ip);
    return this;
  }

  async shutdown(): Promise<void> {
    if (this.webSocketServer) {
      await new Promise((resolve) => {
        this.webSocketServer.close(resolve);
      });
    }
    if (this.httpServer) {
      await new Promise((resolve) => {
        this.httpServer.close(resolve);
      });
    }
  }

  private static routes(req: Request, res: Response, next: NextFunction) {
    const _p = req.path.replace(/\/+$/, "");
    switch (_p) {
      case "":
      case "/ui/blocks":
        res.render("blocks");
        break;
      case "/blocks":
        //@FIXME
        res.json({ height: 123456789, filter: "abc", page: 1, pages: 10, html: "<p>hello world</p>" });
        break;
      default:
        next();
    }
  }

  private static error(err: any, req: Request, res: Response) {
    // set locals, only providing error in development
    res.locals.status = err.status;
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);

    // render the error page
    if (req.accepts("html")) {
      res.render("error");
    } else {
      res.json({
        message: res.locals.message,
        error: res.locals.error,
      });
    }
  }
}
