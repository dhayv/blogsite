locals {
  s3_origin_id = "myS3Origin"
}

resource "aws_cloudfront_function" "url_rewrite" {
  name    = "url-rewrite-index"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite extensionless URLs to /index.html"
  publish = true
  code    = <<-EOT
    function handler(event) {
        var request = event.request;
        var uri = request.uri;
        if (!uri.includes('.')) {
            if (!uri.endsWith('/')) {
                uri += '/';
            }
            uri += 'index.html';
        }
        request.uri = uri;
        return request;
    }
  EOT
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
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  ordered_cache_behavior {
    path_pattern = "/_astro/*"
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

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.url_rewrite.arn
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/404.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/404.html"
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
