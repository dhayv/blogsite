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
}

variable "s3_request_id" {
  type = string
}
