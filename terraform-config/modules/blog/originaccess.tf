resource "aws_cloudfront_origin_access_identity" "blog_oai" {
    comment = "${var.domain_name}"
}