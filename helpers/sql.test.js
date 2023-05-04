const { sqlForPartialUpdate } = require("../helpers/sql");


describe("test SQL update function", () => {
    test("return columns to set and values", () => {
        const data = {firstName: "test1", lastName: "testing1"}
        const jsToSql = {firstName: "first_name", lastName:"last_name"}
        const { setCols, values } = sqlForPartialUpdate(data, jsToSql);
        expect(setCols).toEqual(`"first_name"=$1, "last_name"=$2`);
        expect(values).toEqual(["test1", "testing1"]);
    })
    test("error if no data", () => {
        const data = {}
        const jsToSql = {firstName: "first_name", lastName:"last_name"}
        try {
            const { setCols, values } = sqlForPartialUpdate(data, jsToSql);
        } catch (e) {
            expect(e.message).toEqual("No data")
        }
        
    })
})