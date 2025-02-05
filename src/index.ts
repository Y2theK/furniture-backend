import { app } from "./app";

import "dotenv/config";

const PORT = process.env.PORT || 4000;
app.listen(process.env.PORT, () => {
    console.log(`Server is running at port ${PORT}`);
})
