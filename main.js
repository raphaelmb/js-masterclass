class DatabaseError {
  constructor(statement, message) {
    this.statement = statement;
    this.message = message;
  }
}

class Parser {
  constructor() {
    this.commands = new Map();
    this.commands.set("createTable", /create table (\w+) \((.+)\)/);
    this.commands.set("insert", /insert into (\w+) \((.+)\) values \((.+)\)/);
    this.commands.set("select", /select (.+) from (\w+)(?: where (.+))?/);
    this.commands.set("delete", /delete from ([a-z]+)(?: where (.+))?/);
  }

  parse(statement) {
    for (let [command, regexp] of this.commands) {
      const parsedStatement = statement.match(regexp);
      if (parsedStatement) {
        return {
          command,
          parsedStatement,
        };
      }
    }
  }
}

class Database {
  constructor() {
    this.tables = {};
    this.parser = new Parser();
  }

  createTable(parsedStatement) {
    let [, tableName, columns] = parsedStatement;
    this.tables[tableName] = {
      columns: {},
      data: [],
    };
    columns = columns.split(",");
    for (let column of columns) {
      const [name, type] = column.trim().split(" ");
      this.tables[tableName].columns[name] = type;
    }
  }

  insert(parsedStatement) {
    let [, tableName, columns, values] = parsedStatement;
    columns = columns.split(", ");
    values = values.split(", ");
    const row = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    this.tables[tableName].data.push(row);
  }

  select(parsedStatement) {
    let [, columns, tableName, whereClause] = parsedStatement;
    columns = columns.split(", ");
    let rows = this.tables[tableName].data;
    if (whereClause) {
      const [columnWhere, valueWhere] = whereClause.split(" = ");
      rows = rows.filter((row) => {
        return row[columnWhere] === valueWhere;
      });
    }
    rows = rows.map((row) => {
      let selectedRow = {};
      columns.forEach((column) => {
        selectedRow[column] = row[column];
      });

      return selectedRow;
    });

    return rows;
  }

  delete(parsedStatement) {
    let [, tableName, whereClause] = parsedStatement;
    if (whereClause) {
      const [columnWhere, valueWhere] = whereClause.split(" = ");
      this.tables[tableName].data = this.tables[tableName].data.filter(
        (object) => {
          return object[columnWhere] !== valueWhere;
        }
      );
    } else {
      this.tables[tableName].data = [];
    }
  }

  execute(statement) {
    const result = this.parser.parse(statement);
    if (result) {
      return this[result.command](result.parsedStatement);
    }
    const message = `Syntax error: "${statement}"`;
    throw new DatabaseError(statement, message);
  }
}

try {
  const database = new Database();
  database.execute(
    "create table author (id number, name string, age number, city string, state string, country string)"
  );
  database.execute(
    "insert into author (id, name, age) values (1, Douglas Crockford, 62)"
  );
  database.execute(
    "insert into author (id, name, age) values (2, Linus Torvalds, 47)"
  );
  database.execute(
    "insert into author (id, name, age) values (3, Martin Fowler, 54)"
  );
  database.execute("delete from author where id = 2");
  database.execute("select name, age from author");
  console.log(
    JSON.stringify(
      database.execute("select name, age from author"),
      undefined,
      " "
    )
  );
} catch (e) {
  console.log(e.message);
}
