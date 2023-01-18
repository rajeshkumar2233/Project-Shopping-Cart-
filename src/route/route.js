const express = require("express")
const router = express.Router()
const userController = require("../controller/userController");
const productController = require("../controller/productController");
const {authentication,authorization} = require("../middleware/auth");
const cartController = require("../controller/cartController")
const orderController = require("../controller/orderController")


// ================ Start User Controller Api's ====================
router.post("/register", userController.createUser)
router.post("/login", userController.login)
router.get("/user/:userId/profile", authentication, userController.getUserProfile)
router.put("/user/:userId/profile", authentication, authorization, userController.updateUser)

// ================ Start Product Controller Api's ====================
router.post("/products",productController.createProduct)
router.put("/products/:productId", productController.updateProduct)
router.delete( "/products/:productId",productController.deletebyId)
router.get("/products", productController.getproducts)
router.get('/products/:productId',productController.getWithPath)
router.delete( "/products/:productId",productController.deletebyId)

//======================= Cart Api's =============================
router.post("/users/:userId/cart", authentication, authorization, cartController.CreateCart )
router.put("/users/:userId/cart", authentication, authorization, cartController.updateCart)
router.get("/users/:userId/cart", authentication, authorization, cartController.getCart)
router.delete("/users/:userId/cart", authentication, authorization, cartController.deleteCart)

//======================= Order Api's =============================
router.post("/users/:userId/orders", authentication, authorization, orderController.createOrder)
router.put("/users/:userId/orders", authentication, authorization, orderController.updateOrder)

//======================== End ====================================
router.all("/*",function(req,res){
    return res.status(404).send({status:false,message:"Url Not Found"})
})


module.exports = router 










