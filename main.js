const DatabaseError = function (statement, message) {
  this.statement = statement;
  this.message = message;
};

const database = {
  tables: {},

  createTable(statement) {
    const regexp = /create table (\w+) \((.+)\)/;
    const parsedStatement = statement.match(regexp);
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
  },

  insert(statement) {
    const regexp = /insert into (\w+) \((.+)\) values \((.+)\)/;
    const parsedStatement = statement.match(regexp);
    let [, tableName, columns, values] = parsedStatement;

    columns = columns.split(", ");
    values = values.split(", ");

    const row = {};

    columns.forEach((column, index) => {
      row[column] = values[index];
    });

    this.tables[tableName].data.push(row);
  },

  select(statement) {
    const regexp = /select (.+) from (\w+)(?: where (.+))?/;
    const parsedStatement = statement.match(regexp);
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
  },

  delete(statement) {
    const regexp = /delete from (.+)(?: where (.+))?/;
    const parsedStatement = statement.match(regexp);
    console.log(parsedStatement);
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
  },

  execute(statement) {
    if (statement.startsWith("create table")) {
      return this.createTable(statement);
    }

    if (statement.startsWith("insert into")) {
      return this.insert(statement);
    }

    if (statement.startsWith("select")) {
      return this.select(statement);
    }

    if (statement.startsWith("delete")) {
      return this.delete(statement);
    }

    const message = `Syntax error: "${statement}"`;
    throw new DatabaseError(statement, message);
  },
};

try {
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
      database.execute(
        "create table author (id number, name string, age number, city string, state string, country string)"
      ),
      undefined,
      " "
    )
  );
} catch (e) {
  console.log(e.message);
}
