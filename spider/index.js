const fs = require('fs');

const request = require('syncrequest');
const cheerio = require('cheerio');
const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'springuser',
  password: 'ThePassword',
  database: 'book_store',
});

const log = console.log;

class Book {
  constructor() {
    this.name = '';
    this.score = 0;
    this.quote = '';
    this.numberOfComments = 0;
    this.author = '';
    this.press = '';
    this.price = 0;
    this.year = 0;
  }
}

const bookFromTable = table => {
  let e = cheerio.load(table);
  let book = new Book();
  book.name = e('.pl2')
    .find('a')
    .attr('title');
  book.score = Number(e('.rating_nums').text());
  book.quote = e('.inq').text();
  book.numberOfComments = Number(
    e('.star')
      .find('.pl')
      .text()
      .slice(22, -21),
  );
  let info = e('p[class=pl]')
    .text()
    .split(' / ');
  console.log(info);
  let infoLength = info.length;
  book.author = info[0];
  book.price = info[infoLength - 1];
  book.year = Number(info[infoLength - 2].slice(0, 4));
  book.press = info[infoLength - 3];
  return book;
};

const getBooksFromUrl = url => {
  let res = request.get.sync(url);
  let body = res.body;
  let e = cheerio.load(body);
  let bookTables = e('.item');
  let books = [];
  for (let i = 0; i < bookTables.length; i++) {
    let table = bookTables[i];
    let b = bookFromTable(table);
    books.push(b);
  }
  return books;
};

const savebook = books => {
  let s = JSON.stringify(books, null, 2);
  let path = 'douban.json';
  fs.writeFileSync(path, s);
};
const saveToDB = books => {
  connection.connect();
  // 数据库表结构待调整，暂时先放着
  let addSql =
    'INSERT INTO book(Id,name,score,author,numberOfComments,press,press,year) VALUES(0,?,?,?,?)';
  books.map(book => {
    // let addParams = [
    //   this.name,
    //   this.score,
    //   this.quote,
    //   this.numberOfComments,
    //   this.author,
    //   this.press,
    //   this.press,
    //   this.year,
    // ];
    let addParams = book.values;
    connection.query(addSql, addParams, (err, result) => {
      if (err) {
        log(`ERROR:${err.message}`);
      }
    });
  });
  connection.end();
};
const runSpider = () => {
  let books = [];
  for (let page = 0; page < 10; page++) {
    log(`loading from  page ${page}`);
    let start = page * 25;
    let url = `https://book.douban.com/top250?start=${start}`;
    let booksInPage = getBooksFromUrl(url);
    books = books.concat(booksInPage);
  }
  savebook(books);
  saveToDB(books);
  log('loading success');
};

runSpider();
