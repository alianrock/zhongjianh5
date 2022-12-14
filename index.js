const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const request = require("request-promise")
const { init: initDB, Counter } = require("./db");

const logger = morgan("tiny");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

// 首页
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 更新计数
app.post("/api/count", async (req, res) => {
  const { action } = req.body;
  if (action === "inc") {
    await Counter.create();
  } else if (action === "clear") {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

// 获取计数
app.get("/api/count", async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get("/api/wx_openid", async (req, res) => {
    if (req.headers["x-wx-source"]) {
      const result = await request({
        method: 'get',
        // url: 'http://api.weixin.qq.com/wxa/msg_sec_check?access_token=TOKEN',
        uri: 'http://api.weixin.qq.com/sns/userinfo', // 这里就是少了一个token
        qs: {
          lang: 'zh_CN',
          openid: req.headers["x-wx-openid"], // 可以从请求的 header 中直接获取 req.headers['x-wx-openid']
        },
        json: true
      })
      console.log(result)
      console.log(req.headers["x-wx-openid"])
      res.send(JSON.parse(result.response.body));
    } else {
      res.send({
        code: 400
      });
    }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  await initDB();
  app.listen(port, () => {
    console.log("启动成功", port);
  });
}

bootstrap();
