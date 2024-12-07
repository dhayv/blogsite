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


  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
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
