variable "domain_name" {
    description = "The primary domain name for the ACM certificate."
    type = string
}

variable "aws_region" {
  type = string
}

variable "zone_id" {
  type = string
}

variable "aws_profile" {
  type = string
  default = ""
}


variable "s3_caching_policy" {
  type = string
}

variable "s3_request_id" {
  type = string
}

variable "header_policy" {
  type = string
}