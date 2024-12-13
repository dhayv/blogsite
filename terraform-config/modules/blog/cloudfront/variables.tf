variable "domain_name" {
  type = string
}

variable "acm_certificate_arn" {
  type = string
}

variable "origin_access_control_id" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "s3_caching_policy" {
  type = string
  default = "658327ea-f89d-4fab-a63d-7e88639e58f6"
}

variable "s3_request_id" {
  type = string
  default = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
}

variable "header_policy" {
  type = string
  default = "5cc3b908-e619-4b99-88e5-2cf7f45965bd"
}

variable "function_arn" {
  type = string
}