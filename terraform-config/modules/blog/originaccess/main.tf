resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "${var.domain_name} OAC"
  description                       = "Origin access control for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}