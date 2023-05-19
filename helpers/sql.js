const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
/** 
  * The dataToUpdate variable will accept an Object to determine which fields will be updated.
  * @param dataToUpdate {Object} {firstName: newName, lastName: newName}
  * 
  * 
  * @param jsToSql  {Object} {firstName = "first_name"} 
  * The jsToSql will help turn data in JavaScript syntax to more database friendly syntax. 
  * It will ultimately end up with this: ['"first_name"=$1', '"age"=$2']
  * 
  * 
  * 
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
