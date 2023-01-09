import mongoose from 'mongoose';

export default (() => {
    
    try{
        const database: any = process.env.DATABASE;

        const database_password: any = process.env.DATABASE_PASSWORD;

        const db = database.replace('<password>', database_password);

        mongoose.connect( db );

        console.log("Database (Mongodb) connection successful!");

    } catch (err){
        console.log("Could not connect to database");
    }

})();