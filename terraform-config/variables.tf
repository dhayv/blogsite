variable "domain_name" {
    description = "The primary domain name for the ACM certificate."
    type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "zone_name" {
  type = string
}

