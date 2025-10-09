import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        requied: true
    },
    price:{
        type: Number,
        required: true
    },
    image:{
        type: String,
        required: [true, "Image is required"]
    },
    category:{
        type: String,
        required: true
    },
    isFeatured:{
        type: Boolean,
        default: false
    }
}, {timestamps: true});

const Product = mongoose.model("Prodcut", productSchema);

export default Product;