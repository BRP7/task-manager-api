export const errorHandler  = (error,req,res,next) => {
    console.log(error);

    res.status(error.status || 500).json({
        success : false,
        message : error.message || "Internal server error"
    });
}