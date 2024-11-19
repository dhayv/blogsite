resource "aws_cloudfront_origin_access_control" "default" {
  name                              = "${var.domain_name} OAC"
  description                       = "Managed by Terraform"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}