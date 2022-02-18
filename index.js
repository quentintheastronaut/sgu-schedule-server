const express = require("express");
const app = express();
const port = 3000;
var cors = require("cors");
const request = require("request-promise");
const cheerio = require("cheerio");

app.use(cors());

function isNumeric(num) {
  return !isNaN(num);
}

function occurrences(string, subString, allowOverlapping) {
  string += "";
  subString += "";
  if (subString.length <= 0) return string.length + 1;

  var n = 0,
    pos = 0,
    step = allowOverlapping ? 1 : subString.length;

  while (true) {
    pos = string.indexOf(subString, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else break;
  }
  return n;
}

app.get("/", (req, res) => {
 
  res.status(200).send("Hello");
});

app.get("/profile", (req, res) => {
  if (!req.query.id) {
    const response = {
      statusCode: "400",
      message: "Bad Request: Invalid Student Id",
      data: [],
    };
    res.status(400).send(response);
  }
  if (!isNumeric(req.query.id)) {
    const response = {
      statusCode: "400",
      message: "Bad Request: Invalid Student Id",
      data: [],
    };
    res.status(400).send(response);
  } else {
    const studentId = req.query.id;

    request(
      `http://thongtindaotao.sgu.edu.vn/Default.aspx?page=thoikhoabieu&sta=1&id=${studentId}`,
      (error, response, html) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(html);

          if ($(".grid-roll2").length === 0) {
            const response = {
              statusCode: "404",
              message: "Student ID not found",
              data: [],
            };
            res.status(404).send(response);
          } else {
            const id = $(
              "#ctl00_ContentPlaceHolder1_ctl00_lblContentMaSV"
            ).text();
            const name = $("#ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV")
              .text()
              .split(" - Ngày sinh:")[0];
            const dob = $("#ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV")
              .text()
              .split(" - Ngày sinh:")[1];
            const grade = $("#ctl00_ContentPlaceHolder1_ctl00_lblContentLopSV")
              .text()
              .split(" - ")[0];
            const major = $("#ctl00_ContentPlaceHolder1_ctl00_lblContentLopSV")
              .text()
              .split(" - ")[1]
              .split("Ngành: ")[1];
            const faculty = $(
              "#ctl00_ContentPlaceHolder1_ctl00_lblContentLopSV"
            )
              .text()
              .split("Khoa: ")[1];

            let profile = {
              id: id,
              name: name,
              dob: dob,
              grade: grade,
              major: major,
              falcuty: faculty,
            };

            const response = {
              statusCode: "200",
              message: "OK",
              data: profile,
            };
            res.status(200).send(response);
          }
        } else {
          const response = {
            statusCode: "500",
            message: "Internal Server Error",
            data: [],
          };
          res.status(400).send(response);
        }
      }
    );
  }
});

app.get("/schedule", (req, res) => {
  if (!req.query.id) {
    const response = {
      statusCode: "400",
      message: "Bad Request: Invalid Student Id",
      data: [],
    };
    res.status(400).send(response);
  }

  const studentId = req.query.id;

  request(
    `http://thongtindaotao.sgu.edu.vn/Default.aspx?page=thoikhoabieu&sta=1&id=${studentId}`,
    (error, response, html) => {
      if (!error && response.statusCode == 200) {
        const $ = cheerio.load(html);

        if ($(".grid-roll2").length === 0) {
          const response = {
            statusCode: "404",
            message: "Student ID not found",
            data: [],
          };
          res.status(404).send(response);
        } else {
          let arr = [];

          $(".grid-roll2 > .body-table")
            .children()
            .each((i, bodyTable) => {
              $(bodyTable)
                .children()
                .each((n, tr) => {
                  const date = [];
                  const start = [];
                  const room = [];
                  const period = [];
                  const lecturer = [];
                  const week = [];

                  const tr8 = $(tr).children()[8];
                  const tr9 = $(tr).children()[9];
                  const tr10 = $(tr).children()[10];
                  const tr11 = $(tr).children()[11];
                  const tr12 = $(tr).children()[12];
                  const tr13 = $(tr).children()[13];

                  $(tr8)
                    .children()
                    .each((index, element) => {
                      date.push($(element).text());
                    });

                  $(tr9)
                    .children()
                    .each((index, element) => {
                      start.push($(element).text());
                    });

                  $(tr10)
                    .children()
                    .each((index, element) => {
                      period.push($(element).text());
                    });

                  $(tr11)
                    .children()
                    .each((index, element) => {
                      room.push($(element).text());
                    });

                  $(tr12)
                    .children()
                    .each((index, element) => {
                      lecturer.push($(element).text());
                    });

                  $(tr13)
                    .children()
                    .each((index, element) => {
                      week.push($(element).text());
                    });

                  const id = $(tr).children()[0];
                  const name = $(tr).children()[1];
                  const group = $(tr).children()[2];
                  const credits = $(tr).children()[3];
                  const classCode = $(tr).children()[4];
                  const tuitionCredits = $(tr).children()[4];

                  const subject = {
                    id: $(id).text(),
                    name: $(name).text(),
                    group: $(group).text(),
                    credits: $(credits).text(),
                    classCode: $(classCode).text(),
                    tuitionCredits: $(tuitionCredits).text(),
                    date: date,
                    start: start,
                    room: room,
                    period: period,
                    lecturer: lecturer,
                    week: week,
                  };

                  arr.push(subject);
                });
            });

          const response = {
            statusCode: "200",
            message: "OK",
            data: arr,
          };
          res.status(200).send(response);
        }
      } else {
        const response = {
          statusCode: "500",
          message: "Internal Server Error",
          data: [],
        };
        res.status(400).send(response);
      }
    }
  );
});

app.listen(port, () => {
  console.log(`SGU-Schedule server is running at port ${port}`);
});
