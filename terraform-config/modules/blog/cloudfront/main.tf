locals {
  s3_origin_id = "myS3Origin"
}



resource "aws_cloudfront_distribution" "my_distribution" {
  origin {
    domain_name              = "${var.bucket_name}.s3.amazonaws.com"
    origin_access_control_id = var.origin_access_control_id
    origin_id                = local.s3_origin_id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Cloudfront distribution for ${var.domain_name}"
  default_root_object = "index.html"
  
  aliases = [var.domain_name, "www.${var.domain_name}"]

  ordered_cache_behavior {
    path_pattern = "/blog*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    cache_policy_id = var.s3_caching_policy
    origin_request_policy_id = var.s3_request_id
    response_headers_policy_id = var.header_policy

    viewer_protocol_policy = "redirect-to-https"
    compress = true
  }
  
  ordered_cache_behavior {
    path_pattern = "/_next/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    cache_policy_id = var.s3_caching_policy
    origin_request_policy_id = var.s3_request_id
    response_headers_policy_id = var.header_policy

    viewer_protocol_policy = "redirect-to-https"
    compress = true
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    cache_policy_id = var.s3_caching_policy
    origin_request_policy_id = var.s3_request_id
    response_headers_policy_id = var.header_policy

    viewer_protocol_policy = "redirect-to-https"
    compress = true
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["US", "CA", "GB"]
    }
  }

  viewer_certificate {
    acm_certificate_arn = var.acm_certificate_arn
    ssl_support_method = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}


