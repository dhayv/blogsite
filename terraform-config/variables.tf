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

variable "function_arn" {
  type = string
}
