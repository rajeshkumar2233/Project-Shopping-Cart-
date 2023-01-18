const validator = require("../validator/validator")
const cartModel = require("../model/cartModel")
const productModel = require("../model/productModel")
const userModel = require("../model/userModel")


//========================================🛒🔨🔧[CREATE CART] ================================================================================
const CreateCart = async (req, res) => {
    try {
        let requestBody = req.body
        let userId = req.params.userId

        const { productId, cartId } = requestBody

        if (validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Provide some data inside the body " })
        }
        // validation for cartId
        if (cartId) {
            if (!validator.isValid1(cartId)) {
                return res.status(400).send({ status: false, message: "cartId is required" })
            }
            if (!validator.isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "Cart Id not valid" })
            }
        }
        // validation for productId
        if (!validator.isValid1(productId)) {
            return res.status(400).send({ status: false, message: "productId is required" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "product  Id not valid" })
        }

        const CheckProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!CheckProduct) {
            return res.status(404).send({ status: false, message: 'Product Not found' })
        }

        const checkCartPresent = await cartModel.findOne({ userId: userId })
        // creating the new Cart
        if (!checkCartPresent) {
            const cartObject = {
                userId: userId,
                items: [{ productId: productId, quantity: 1 }],
                totalPrice: CheckProduct.price,
                totalItems: 1

            }
            const createCart = await cartModel.create(cartObject)
            return res.status(201).send({ status: true, message: "Success", data: createCart })
        }

        if (checkCartPresent) {
            if (checkCartPresent._id.toString() !== cartId) {
                return res.status(404).send({ status: false, message: "Cart Not found please enter valid Cart Id" })
            }
        }
        // updating the same product quantity
        let array = checkCartPresent.items
        for (let i = 0; i < array.length; i++) {
            if (array[i].productId == productId) {
                array[i].quantity = array[i].quantity + 1
                const updateCart = await cartModel.findOneAndUpdate(
                    { userId: userId },
                    {
                        items: array,
                        totalPrice: checkCartPresent.totalPrice + CheckProduct.price
                    }, { new: true }
                )
                return res.status(201).send({ status: true, message: "Success", data: updateCart })
            }
        }
        // adding the new product to the cart &  updating the total price and total items 
        const cartObject = {
            $addToSet: { items: { productId: productId, quantity: 1 } },
            totalPrice: checkCartPresent.totalPrice + CheckProduct.price,
            totalItems: checkCartPresent.totalItems + 1,
        }
        const cartUpdate = await cartModel.findOneAndUpdate({ userId: userId }, cartObject, { new: true })
        return res.status(201).send({ status: true, message: "Success", data: cartUpdate })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//=============================================🔄🛒🛒[UPDATE CART]================================================================
const updateCart = async (req, res) => {
    try {
        let requestBody = req.body
        let userId = req.params.userId

        const { productId, cartId, removeProduct } = requestBody

        if (validator.isValidBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Provide some data inside the body " })
        }
        // validation for cartId
        if (!validator.isValid1(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is required" })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Cart Id not valid" })
        }
        const checkCart = await cartModel.findById(cartId)
        if (!checkCart) {
            return res.status(404).send({ status: false, message: 'Cart Not Found' })
        }
        // validation for productId
        if (!validator.isValid1(productId)) {
            return res.status(400).send({ status: false, message: "productId is required" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "product  Id not valid" })
        }
        const CheckProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!CheckProduct) {
            return res.status(404).send({ status: false, message: 'Product Not found' })
        }
        // validation for removeProduct
        if (!validator.isValid1(removeProduct)) {
            return res.status(400).send({ status: false, message: "removeProduct key required" })
        }
        if (!/1|0/.test(removeProduct)) {
            return res.status(400).send({ status: false, message: "removeProduct must be 0 or 1" })
        }
        //-product will be removed from cart-
        if (removeProduct == 0) {
            let itemsarr = checkCart.items
            if (itemsarr.length == 0)
                return res.status(400).send({ status: false, message: "No products to remove cart is empty" })

            for (let i = 0; i < itemsarr.length; i++) {
                let productIdInitems = itemsarr[i].productId.toString()
                let quantity = itemsarr[i].quantity
                //updates old product i.e QUANTITY
                if (productIdInitems == productId) {
                    itemsarr.splice(i, 1)
                    let priceReduce = checkCart.totalPrice - (CheckProduct.price * quantity)
                    checkCart.totalPrice = priceReduce;
                    let items = checkCart.totalItems
                    checkCart.totalItems = items - 1
                    await checkCart.save()
                    return res.status(200).send({ status: true, message: 'Success', data: checkCart })
                }
            }
            return res.status(404).send({ status: false, message: "No products found with given productid in cart" })
        }
        //product will be reduced by one quantity
        if (removeProduct == 1) {
            let itemsarr = checkCart.items
            if (itemsarr.length == 0)
                return res.status(404).send({ status: false, message: "No products found to reduce with given productid in cart" })

            for (let i = 0; i < itemsarr.length; i++) {
                let quantity = itemsarr[i].quantity
                let productIdInitems = itemsarr[i].productId.toString()
                if (productId == productIdInitems) {
                    if (quantity == 1) {

                        itemsarr.splice(i, 1)
                        let priceReduce = checkCart.totalPrice - (CheckProduct.price * quantity)
                        checkCart.totalPrice = priceReduce;
                        let items = checkCart.totalItems
                        checkCart.totalItems = items - 1
                        await checkCart.save();
                        return res.status(200).send({ status: true, message: 'Success', data: checkCart })
                    }

                    let priceReduce = checkCart.totalPrice - CheckProduct.price
                    let newquant = quantity - 1
                    itemsarr[i].quantity = newquant
                    checkCart.totalPrice = priceReduce
                    await checkCart.save();
                    return res.status(200).send({ status: true, message: 'Success', data: checkCart })
                }
            }
            return res.status(404).send({ status: false, message: "No products found with given productid in your cart" })
        }
    }
    catch (err) {
        return res.status(500).send({ err: err.message });
    }
}
//==============================================📢🧲🛒[GET CART]==================================================================================
const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        //checking if the cart exist with this userId or not
        let validCart = await cartModel.findOne({ userId: userId }).select({ "items._id": 0, __v: 0 })
        if (!validCart) return res.status(404).send({ status: false, message: "No cart found" })
        return res.status(200).send({ status: true, message: 'Success', data: validCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, err: err.message });
    }
}
//==============================================💥❌🛒[DELETE  CART] /users/:userId/cart ==============================================================================
const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        //checking if the cart is present with this userId or not
        let findCart = await cartModel.findOne({ userId: userId });
        //checking for an empty cart
        if (findCart.items.length == 0) {
            return res.status(400).send({ status: false, message: "Cart is already empty" });
        }
        //cart will be deleted-
        await cartModel.updateOne({ _id: findCart._id },
            { items: [], totalPrice: 0, totalItems: 0 });
        return res.status(204).send({ status: false, message: "Deleted Sucessfully" });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { CreateCart, updateCart, getCart, deleteCart }