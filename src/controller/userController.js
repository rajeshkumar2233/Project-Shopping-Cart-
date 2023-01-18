const userModel = require("../model/userModel");
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
const aws = require('../aws/aws.js')
const validator = require("../validator/validator")

//=============================================== CREATE USER ===============================================================
const createUser = async (req, res) => {
    try {
        let data = req.body;
        let files = req.files;
        let { fname, lname, email, password, phone, address } = data;

        if (validator.isValidBody(data)) return res.status(400).send({ status: false, message: "Enter details to create your account" });
        //validating firstname
        if (!fname) return res.status(400).send({ status: false, message: "First name is required" });

        //checking for firstname
        if (validator.isValid(fname)) return res.status(400).send({ status: false, message: "First name should not be an empty string" });

        //validating firstname
        if (validator.isValidString(fname)) return res.status(400).send({ status: false, message: "Enter a valid First name and should not contains numbers" });

        //validating lastname
        if (!lname) return res.status(400).send({ status: false, message: "Last name is required" })

        //checking for lastname
        if (validator.isValid(lname)) return res.status(400).send({ status: false, message: "Last name should not be an empty string" });

        //validating lastname
        if (validator.isValidString(lname)) return res.status(400).send({ status: false, message: "Enter a valid Last name and should not contains numbers" });

        //checking for email-id
        if (!email) return res.status(400).send({ status: false, message: "User Email-id is required" });

        //validating user email-id
        if (!validator.isValidEmail(email.trim())) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });

        //checking if email already exist or not
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" })

        //checking for phone number
        if (!phone) return res.status(400).send({ status: false, message: "User Phone number is required" });

        //validating user phone
        if (!validator.isValidPhone(phone.trim())) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if phone already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })

        //checking for password
        if (!password) return res.status(400).send({ status: false, message: "Password is required" });

        //validating user password
        if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character and it should be alpha numeric" });

        //checking for address
        if (!address || validator.isValid(data.address))
            return res.status(400).send({ status: false, message: "Address is required" });

        data.address = JSON.parse(data.address);

        let { shipping, billing } = data.address;
        //validating the address 
        if (data.address && typeof data.address != "object") {
            return res.status(400).send({ status: false, message: "Address is in wrong format" })
        };
        if (shipping) {
            //validation for shipping address
            if (typeof shipping != "object") {
                return res.status(400).send({ status: false, message: "Shipping Address is in wrong format" })
            };
            if (!shipping.street || validator.isValid(shipping.street)) {
                return res.status(400).send({ status: false, message: "Street is required" })
            }
            if (shipping.street && typeof shipping.street !== 'string') {
                return res.status(400).send({ status: false, message: "Street is in wrong format" })
            };
            if (!shipping.city || validator.isValid(shipping.city)) {
                return res.status(400).send({ status: false, message: "City is required" })
            }
            if (shipping.city && typeof shipping.city !== 'string') {
                return res.status(400).send({ status: false, message: "City is in wrong format" })
            };
            if (!validator.isvalidCity(shipping.city)) {
                return res.status(400).send({ status: false, message: "City name should only contain alphabets." });
            }
            if (!shipping.pincode) {
                return res.status(400).send({ status: false, message: "Pincode is required" })
            }
            if (validator.isValid(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
            };
            if (!validator.isValidPincode(shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
            };
        } else {
            return res.status(400).send({ status: false, message: "Shipping address is required" })
        }
        //validation for billing address
        if (billing) {
            if (typeof billing !== "object") {
                return res.status(400).send({ status: false, message: "billing Address is in wrong format" })
            };
            if (!billing.street || validator.isValid(billing.street)) {
                return res.status(400).send({ status: false, message: "Street is required" })
            }
            if (billing.street && typeof billing.street != 'string') {
                return res.status(400).send({ status: false, message: "Street is in wrong format" })
            };
            if (!billing.city || validator.isValid(billing.city)) {
                return res.status(400).send({ status: false, message: "City is required" })
            }
            if (billing.city && typeof billing.city != 'string') {
                return res.status(400).send({ status: false, message: "City is in wrong format" })
            };
            if (!validator.isvalidCity(billing.city)) {
                return res.status(400).send({ status: false, message: "City name should only contain alphabets." });
            }
            if (!billing.pincode) {
                return res.status(400).send({ status: false, message: "Pincode is required" })
            }
            if (validator.isValid(billing.pincode)) {
                return res.status(400).send({ status: false, message: "Pincode is in wrong format" })
            };
            if (!validator.isValidPincode(billing.pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide valid Pincode " })
            };
        } else {
            return res.status(400).send({ status: false, message: "billing address is required" })
        }
        //checking for image link
        if (files.length === 0) return res.status(400).send({ status: false, message: "ProfileImage is required" });

        //hashing password with bcrypt
        data.password = await bcrypt.hash(password, 10);

        //Profile Images check for aws
        if (files && files.length !== 0) {
            if (!validator.isValidimage(files[0].originalname)) return res.status(400).send({ status: false, message: "File format is not valid" });

            let profileImgUrl = await aws.uploadFile(files[0]);
            data.profileImage = profileImgUrl;
        }

        let responseData = await userModel.create(data);
        return res.status(201).send({ status: true, message: "User created successfully", data: responseData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//=============================================login User Api-===========================================================================

const login = async (req, res) => {
    try {
        userDetails = req.body
        if (!Object.keys(userDetails) > 0) {
            return res.status(400).send({ status: false, message: "Please Enter Email or Password" })
        }
        const { email, password } = userDetails
        //  Email Validation 
        if (validator.isValid(email)) {
            return res.status(400).send({ status: false, message: " Email Id Is required" })
        }
        if (!validator.isValidEmail(email)) {
            return res.status(400).send({ status: false, message: " Email Id Is Not Valid" })
        }
        const isEmailExists = await userModel.findOne({ email: email })
        if (!isEmailExists) return res.status(401).send({ status: false, message: "Email is Incorrect" })
        //  Password Validation 
        if (validator.isValid(password)) {
            return res.status(400).send({ status: false, message: " Password Is required" })
        }

        if (!validator.isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Please provide a valid password ,Password should be of 8 - 15 characters", })
        }
        const isPasswordMatch = await bcrypt.compare(password, isEmailExists.password)
        if (!isPasswordMatch) return res.status(401).send({ status: false, message: "Password is Incorrect" })

        // > Create Jwt Token 
        const token = jwt.sign(
            { userId: isEmailExists._id.toString() },
            "Project-5-shoppingCart-group18",
            { expiresIn: '24h' }
        )
        //  Make Respoense
        let result = {
            userId: isEmailExists._id.toString(),
            token: token,
        }
        res.status(200).send({ status: true, message: "Login Successful", data: result })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//================================================get User Api==================================================================

const getUserProfile = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: " Invalid userId ⚠" })
        }

        //getting the user document
        const userProfile = await userModel.findById(userId)
        if (!userProfile) {
            return res.status(404).send({ status: false, message: "User Profile Not Found" })
        }
        res.status(200).send({ status: true, message: "success", data: userProfile })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//===================================================Update User Api========================================================================
let updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body
        let files = req.files;

        let { fname, lname, email, password, address, phone, ...rest } = data

        if (!validator.isValidBody(rest)) {
            return res.status(400).send({ status: false, message: "InValid  Body Request" });
        }
        //validationg the request bod
        if (!(files && !validator.isValidBody(data))) {
            if (!validator.isValidBody(data)) {
                return res.status(400).send({ status: false, message: "Enter details to update your account data" });
            }
        }
        //checking for firstname
        if (typeof fname == 'string') {
            if (validator.isValid(fname)) return res.status(400).send({ status: false, message: "First name should not be an empty string" });

            //validating firstname
            if (validator.isValidString(fname)) return res.status(400).send({ status: false, message: "Enter a valid First name and should not contains numbers" });
        }
        //checking for lastname
        if (typeof lname == 'string') {
            if (validator.isValid(lname)) return res.status(400).send({ status: false, message: "Last name should not be an empty string" });

            //validating lastname
            if (validator.isValidString(lname)) return res.status(400).send({ status: false, message: "Enter a valid Last name and should not contains numbers" });
        }
        //validating user email-id
        if (email) {
            if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: "Please Enter a valid Email-id" });
        }
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) return res.status(400).send({ status: false, message: "Email already exist" });
        //checking if email already exist or not

        //validating user phone number
        if (phone && (!validator.isValidPhone(phone))) return res.status(400).send({ status: false, message: "Please Enter a valid Phone number" });

        //checking if email already exist or not
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) return res.status(400).send({ status: false, message: "Phone already exist" })
        //validating user password
        if (password || typeof password == 'string') {
            if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: "Password should be between 8 and 15 character" });
            //hashing password with bcrypt
            data.password = await bcrypt.hash(password, 10);
        }
        //getting the AWS-S3 link after uploading the user's profileImag
        if (files && files.length !== 0) {
            if (!isValidimage(files[0].originalname)) return res.status(400).send({ status: false, message: "File format is not valid" });
            let profileImgUrl = await aws.uploadFile(files[0]);
            data.profileImage = profileImgUrl;
        }
        // validation for address
        if (address === "") {
            return res.status(400).send({ status: false, message: "Please enter a valid address" })
        } else if (address) {

            if (validator.isValid(address)) {
                return res.status(400).send({ status: false, message: "Please provide address field" });
            }
            address = JSON.parse(address);

            if (typeof address !== "object") {
                return res.status(400).send({ status: false, message: "address should be an object" });
            }
            let { shipping, billing } = address
            // validation for Shipping address
            if (shipping) {
                if (typeof shipping != "object") {
                    return res.status(400).send({ status: false, message: "shipping should be an object" });
                }
                if (validator.isValid(shipping.street)) {
                    return res.status(400).send({ status: false, message: "shipping street is required" });
                }
                if (validator.isValid(shipping.city)) {
                    return res.status(400).send({ status: false, message: "shipping city is required" });
                }
                if (!validator.isvalidCity(shipping.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }
                if (validator.isValid(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "shipping pincode is required" });
                }
                if (!validator.isValidPincode(shipping.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid pincode" });
                }
            } else {
                return res.status(400).send({ status: false, message: "Shipping address is required" })
            }
            // validation for Billing address
            if (billing) {
                if (typeof billing != "object") {
                    return res.status(400).send({ status: false, message: "billing should be an object" });
                }
                if (validator.isValid(billing.street)) {
                    return res.status(400).send({ status: false, message: "billing street is required" });
                }
                if (validator.isValid(billing.city)) {
                    return res.status(400).send({ status: false, message: "billing city is required" });
                }
                if (!validator.isvalidCity(billing.city)) {
                    return res.status(400).send({ status: false, message: "city field have to fill by alpha characters" });
                }
                if (validator.isValid(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "billing pincode is required" });
                }
                if (!validator.isValidPincode(billing.pincode)) {
                    return res.status(400).send({ status: false, message: "please enter valid billing pincode" });
                }
            } else {
                return res.status(400).send({ status: false, message: "Billing address is required" })
            }
            data.address = address
        }
        let userData = await userModel.findOneAndUpdate({ _id: userId }, data, { new: true })
        if (!userData) { return res.status(404).send({ satus: false, message: "no user found to update" }) }
        return res.status(200).send({ satus: true, message: "success", data: userData })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}
//===============================================================================================================================
module.exports = { createUser, login, getUserProfile, updateUser }