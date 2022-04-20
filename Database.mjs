import DatabaseError from "./DatabaseError.mjs";
import Parser from "./Parser.mjs";

export default class Database {
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
