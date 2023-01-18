const mongoose = require('mongoose');

const isValid = (value) => {
  if (typeof value === "undefined" || typeof value === "null") return true;
  if (typeof value === "string" && value.trim().length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
}

const isValid1 = function (value) {
  if (typeof value === "undefined" || value === null) return false
  if (typeof value === "string" && value.trim().length === 0) return false
  return true
}

const isValidFiles = (files) => {
  if (files && files.length > 0) return true
}

const isValidBody = (reqBody) => {
  return Object.keys(reqBody).length === 0;
}

const isValidPassword = (password) => {
    if (password.length > 7 && password.length < 16) return true
}

const isValidPhone = (Mobile) => {
    return /^[6-9]\d{9}$/.test(Mobile)
  };
  
  const isValidEmail = (Email) => {
    return  /^([a-z0-9]+@[a-z]+\.[a-z]{2,3})+$/.test(Email)
  };
  
const isValidPincode = (num) => {
    return  /^[0-9]{6}$/.test(num);
   }
   const  checkImage = (img) => {
    let imageRegex = /(jpeg|png|jpg)$/
    return imageRegex.test(img)
}
const isValidObjectId = (objectId) => {
    return mongoose.Types.ObjectId.isValid(objectId)
    
}
const isValidString = (String) => {
    return /\d/.test(String)
  }
const isvalidCity = function (city){
    return /^[a-zA-z',.\s-]{1,25}$/.test(city)
  }
  const isValidPrice = (price) => {
    return /^[1-9]\d{0,7}(?:\.\d{1,2})?$/.test(price);
  }

  const isValidSize = (sizes) => {
    return ['S', 'XS', 'M', 'X', 'L', 'XXL', 'XL'].includes(sizes);
  }
  const isValidStatus = (status)=>{
    return ["pending", "completed", "cancelled"].includes(status)
  }
  const isValidimage = (value) => {
    let imageRegex = /(\/*\.(?:png|gif|webp|jpeg|jpg))/;
    if (imageRegex.test(value))
        return true;
}
module.exports = {isValidimage,isValidStatus,isValidSize,isValidPrice,isValidFiles,isValid,checkImage,isValidBody,isValidPassword,isValidObjectId,isValidPincode,isValidPhone,isValidEmail,isvalidCity,isValidString,isValid1}
