const productModel = require('../model/productModel');
const validator = require("../validator/validator");
const aws = require('../AWS/aws');

// ====================================  POST /products =============================================
const createProduct = async (req, res) => {
    try {
        let productDetails = req.body
        let files = req.files
        //validation for request body
        if (validator.isValidBody(productDetails)) {
            return res.status(400).send({ status: false, message: "Enter details to create Product" });
        }
        if (!validator.isValidFiles(files)) {
            return res.status(400).send({ status: false, message: "productImage is required" })
        }
        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, ...rest } = productDetails
        if (!validator.isValidBody(rest)) {
            return res.status(400).send({ status: false, message: "InValid  Body Request" });
        }
        //    title validation
        if (!validator.isValid1(title)) {
            return res.status(400).send({ status: false, message: "title is required" })
        }
        const titlePresent = await productModel.findOne({ title: title })
        if (titlePresent) {
            return res.status(400).send({ status: false, message: "title already Present" })
        }
        // description validation
        if (!validator.isValid1(description)) {
            return res.status(400).send({ status: false, message: "description is required" })
        }
        //validation for price
        if (!validator.isValid1(price)) {
            return res.status(400).send({ status: false, message: "price is required" })
        }
        if (!validator.isValidPrice(price)) {
            return res.status(400).send({ status: false, message: "Enter a Valid Price" })
        }
        //validation for currencyId
        if (!validator.isValid1(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (!currencyId.match(/^(INR)$/)) {
            return res.status(400).send({ status: false, message: "currencyId must be INR" })
        }
        //validation for currency format
        if (!validator.isValid1(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }
        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "currency format should be ₹ " })
        }
        //validation for availabel sizes
        if (!validator.isValid1(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please Provide at least one size" })
        }
        if (availableSizes) {
            let availableSize = availableSizes.toUpperCase().split(",") // Creating an array
            productDetails.availableSizes = availableSize;      //set Attribute
            let enumArr = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < availableSize.length; i++) {
                if (!enumArr.includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${enumArr} value with multiple value please give saperated by comma`, })
                }
            }
        }
        // validation for free shipping
        if (isFreeShipping == "") {
            return res.status(400).send({ status: false, message: "Freeshipping can't be empty" })
        }
        if (isFreeShipping) {
            if (!(/^(true|false)$/).test(isFreeShipping))
                return res.status(400).send({ status: false, message: "Freeshipping must be in Boolean (true or false)" })
        }
        //-validation for style
        if (style == "") {
            return res.status(400).send({ status: false, message: "Put Some value in Style" })
        }
        //-validation for installments-
        if (installments == '') {
            return res.status(400).send({ status: false, message: "Put Some value in installments" })
        }
        if (installments) {
            if (!installments.match(/^\d*\.?\d*$/))
                return res.status(400).send({ status: false, message: "Installment must be an integer" })
        }
        //getting the AWS-S3 link after uploading the user's profileImag
        if (files && files.length > 0) {
            let productImgUrl = await aws.uploadFile(files[0])
            productDetails.productImage = productImgUrl
        }
        let productCreated = await productModel.create(productDetails);
        return res.status(201).send({ status: true, message: "Success", data: productCreated })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//===============================================GET /products=============================================
const getproducts = async (req, res) => {
    try {
        let data = req.query
        let filter = { isDeleted: false }
        // validation for size
        if (data.size || data.size == "") {
            if (!validator.isValid1(data.size)) {
                return res.status(400).send({ status: false, message: "Enter some value in product size" })
            }
        }
        if (data.size) {
            let sizes = data.size.toUpperCase().split(",")
            let enumSize = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            for (let i = 0; i < sizes.length; i++) {
                if (!enumSize.includes(sizes[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${enumSize} value (with multiple value please give saperated by comma)` })
                }
            }
            filter.availableSizes = {}
            filter.availableSizes["$in"] = sizes
        }
        // validation for name
        if (data.name || data.name == "") {
            if (!validator.isValid1(data.name)) {
                return res.status(400).send({ status: false, message: "Enter some value in product name" })
            }
            filter.title = {}
            filter.title["$regex"] = data.name
            filter.title["$options"] = "i"
        }
        // validation for price
        if (data.priceGreaterThan === "" || data.priceLessThan === "") {
            return res.status(400).send({ status: false, message: "Price cant be empty" })
        }
        if (data.priceGreaterThan || data.priceLessThan) {
            if (data.priceGreaterThan) {
                if (!validator.isValidPrice(data.priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "priceGreaterThan should be Number " })
                }
            }
            if (data.priceLessThan) {
                if (!validator.isValidPrice(data.priceLessThan)) {
                    return res.status(400).send({ status: false, message: "priceLessThan should be Number " })
                }
            }
            filter.price = {}
            if (data.priceGreaterThan && data.priceLessThan) {
                filter.price["$gt"] = data.priceGreaterThan
                filter.price["$lt"] = data.priceLessThan
            } else {
                if (data.priceGreaterThan) filter.price["$gt"] = data.priceGreaterThan
                if (data.priceLessThan) filter.price["$lt"] = data.priceLessThan
            }
        }
        // validation for price sorting
        if (data.priceSort || data.priceSort == "") {
            if (!data.priceSort.match(/^(1|-1)$/)) {
                return res.status(400).send({ status: false, message: "priceSort must be 1 or -1" })
            }
        }
        const getProduct = await productModel.find(filter).sort({ price: data.priceSort })
        if (!getProduct.length) {
            return res.status(404).send({ status: false, message: "Product not found" })
        }
        return res.status(200).send({ status: true, message: "Success", data: getProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//====================GET API GETTING LIST OF ALL PRODUCT BY PRODUCTID=========================================

const getWithPath = async function (req, res) {
    try {
        let id = req.params.productId
        // validation for productId 
        if (!validator.isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Please provide valid Product Id" })
        }
        // finding the product with db call
        let productDetails = await productModel.findOne({ _id: id, isDeleted: false })

        if (!productDetails) {
            return res.status(404).send({ status: false, message: "no product found" })
        }
        return res.status(200).send({ status: true, message: "Success", data: productDetails })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }


}
// ==================================== PUT product/:productId =============================================

const updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId
        // validation for product ID
        if (!validator.isValidObjectId(productId)) { return res.status(400).send({ status: false, message: "Please provide valid Product Id" }) }
        // checking product existing or not
        let getId = await productModel.findOne({ _id: productId })
        if (!getId) { return res.status(404).send({ status: false, message: "Product Not Found for the request id" }); }
        if (getId.isDeleted == true) { return res.status(404).send({ status: false, message: "Product is already deleted " }); }

        let data = req.body;
        let files = req.files;

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, ...rest } = data

        if (!validator.isValidBody(rest)) {
            return res.status(400).send({ status: false, message: "InValid  Body Request" });
        }
        // file validation
        if (validator.isValidBody(data)) return res.status(400).send({ status: false, message: "Body cannot be empty " })
        //checking for product image
        if (files && files.length > 0) {
            //uploading the product image
            let productImgUrl = await aws.uploadFile(files[0]);
            data.productImage = productImgUrl;
        }
        // title validation
        if (title || title == "string") {
            if (validator.isValid(title)) { return res.status(400).send({ status: false, message: "title should not be empty String" }) }
            //Check the title for duplicate
            let duplicateTitle = await productModel.findOne({ title: title })
            if (duplicateTitle) { return res.status(400).send({ status: false, message: "title is already present in database" }) }
        }
        // Description validation
        if (description || description == "string") {
            if (validator.isValid(description)) { return res.status(400).send({ status: false, message: "Description should not be empty String" }) }
        }
        // price validation
        // value shouldnt be empty--- validation
        if (price || price == "string") {
            if (!(validator.isValidString(price) && validator.isValidPrice(price))) return res.status(400).send({ status: false, message: "Price of product should be valid and in numbers" });
        }
        //currency validation
        if (currencyId || typeof currencyId == 'string') {
            //checking for currencyId 
            if (validator.isValid(currencyId)) return res.status(400).send({ status: false, message: "Currency Id of product should not be empty" });

            if (!(/INR/.test(currencyId))) return res.status(400).send({ status: false, message: "Currency Id of product should be in uppercase 'INR' format" });
        }
        //checking for currency format
        if (currencyFormat || typeof currencyFormat == 'string') {
            if (validator.isValid(currencyFormat)) return res.status(400).send({ status: false, message: "Currency format of product should not be empty" });

            if (!(/₹/.test(currencyFormat))) return res.status(400).send({ status: false, message: "Currency format of product should be in '₹' " });
        }
        //free shipping validation
        if (isFreeShipping || isFreeShipping == "") {
            if (!(/^(true|false)$/).test(isFreeShipping))
                return res.status(400).send({ status: false, message: "Freeshipping must be in Boolean (true or false)" })
        }
        //style validation
        if (style || typeof style == 'string') {
            if (validator.isValid(style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
            if (validator.isValidString(style)) return res.status(400).send({ status: false, message: "Style should be valid an does not contain numbers" });
        }
        //availablesizes validation
        if (availableSizes || typeof availableSizes == 'string') {
            //checking for available Sizes of the products
            let size = availableSizes.toUpperCase().split(",") //creating an array
            data.availableSizes = size;

            for (let i = 0; i < size.length; i++) {
                if (!validator.isValidSize(size[i])) { return res.status(400).send({ status: false, message: "Sizes should one of these - 'S', 'XS', 'M', 'X', 'L', 'XXL' and 'XL'" }) }
            }
        }
        // validation for the installments
        if (installments || typeof installments == 'string') {
            if (!validator.isValidString(installments)) return res.status(400).send({ status: false, message: "Installments should be in numbers and valid" });
        }
        let updatedProduct = await productModel.findByIdAndUpdate({ _id: productId }, data, { new: true })
        return res.status(200).send({ status: true, message: "Product updated successfully", data: updatedProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
// ======================================== DELETE product/:productId =====================================

const deletebyId = async (req, res) => {
    try {
        let product = req.params.productId
        // validation of productId
        if (!validator.isValidObjectId(product)) { res.status(400).send({ status: false, message: "Please provide valid Product Id" }) }

        let getId = await productModel.findOne({ _id: product });
        if (!getId) { return res.status(404).send({ status: false, message: "Product Not Found for the request id" }) }
        if (getId.isDeleted == true) { return res.status(404).send({ status: false, message: "Product is already deleted not found" }) }

        await productModel.updateOne({ _id: product }, { isDeleted: true, deletedAt: Date.now() })
        return res.status(200).send({ status: true, message: "Product is deleted" })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};


module.exports = { createProduct, updateProduct, deletebyId, getproducts, getWithPath }


