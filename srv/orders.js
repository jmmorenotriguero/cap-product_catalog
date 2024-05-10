const cds = require("@sap/cds");
const { Orders } = cds.entities("com.training");

module.exports = (srv) => {

    srv.on("READ", "GetOrders", async (req) => {

        if (req.data.ClientEmail !== undefined) {
            return await SELECT.from`com.training.Orders`.where`ClientEmail = ${req.data.ClientEmail}`;
        }

        return await SELECT.from(Orders);
    });


    srv.after("READ", "Orders", (data) => {
        data.map((order) => (order.Reviewed = true));
    });


    srv.on("CREATE", "Orders", async (req) => {

        let returnData = await cds
            .transaction(req)
            .run(
                INSERT.into(Orders).entries({
                    ClientEmail: req.DATA.ClientEmail,
                    FirstName: req.DATA.FirstName,
                    LastName: req.DATA.LastName,
                    CreatedOn: req.DATA.CreatedOn,
                    Reviewed: req.DATA.Reviewed,
                    Approved: req.DATA.Approved,
                })
            )
            .then((resolve, reject) => {
                console.log("Resolve", resolve);
                console.log("Reject", reject);

                if (typeof resolve !== "undefined") {
                    return req.data;
                } else {
                    req.error(409, "Record Not Inserted");
                }
            })
            .catch((err) => {
                console.log(err);
                req.error(err.code, err.message);
            });
        return returnData;
    });


    srv.before("CREATE", "Orders", (req) => {
        req.data.CreatedOn = new Date().toISOString().slice(0, 10);
        return req;
    });


    srv.on("UPDATE", "Orders", async (req) => {
        let returnData = await cds.transaction(req).run(
            [
                UPDATE(Orders, req.data.ClientEmail).set({
                    FirstName: req.data.FirstName,
                    LastName: req.data.LastName
                })
            ]
        ).then((resolve, reject) => {
            console.log("Resolve: ", resolve);
            console.log("Reject: ", reject);

            if (resolve[0] == 0) {
                req.error(409, "Record Not Found");
            }

        }).catch((err) => {
            console.log(err);
            req.error(err.code, err.message);
        });
        console.log("Before End", returnData);
        return returnData;
    });

    srv.on("DELETE", "Orders", async (req) => {
        let returnData = await cds.transaction(req).run(
            DELETE.from(Orders).where({
                clientEmail: req.data.ClientEmail
            })
        ).then((resolve, reject) => {
            console.log("Resolve", resolve);
            console.log("Reject", reject);

            if (resolve !== 1) {
                req.error(409, "Record Not Found");
            }
        })
            .catch((err) => {
                console.log(err);
                req.error(err.code, err.message);
            });
        console.log("Before End", returnData);
        return await returnData;
    });

    srv.on("getClientTaxRate", async (req) => {
        const { clientEmail } = req.data;
        const db = srv.transaction(req);

        const results = await db.read(Orders, ["Country_code"]).where({ ClientEmail: clientEmail });

        console.log(results[0]);

        switch (results[0].Country_code) {
            case "ES":
                return 21.5;
            case "UK":
                return 24.6;
            default:
                break;
        }
    });

    srv.on("cancelOrder", async (req) => {
        const {clientEmail} = req.data;
        const db = srv.transaction(req);

        const resultsRead = await db.read(Orders, ["FirstName", "LastName", "Approved"]).where({clientEmail: clientEmail});

        let returnOrder = {
            status : "",
            message : ""
        };

        console.log(clientEmail);
        console.log(resultsRead);

        if (resultRead[0].Approved == false)
        {
            const resultsUpdate = await db.update(Orders).set({status : 'C'}).where({clientEmail: clientEmail});
            returnOrder.status = "Succeeded";
            returnOrder.messate = `The order placed by ${resultsRead[0].FirstName} ${resultsRead[0].LastName} was cancel`;
        }
        else{
            returnOrder.status = "Failed";
            returnOrder.messate = `The order placed by ${resultsRead[0].FirstName} ${resultsRead[0].LastName} was NOT cancel because was already approved`;
        }

        console.log("Action cancelOrder executed");
        return returnOrder;
    });
};