resource "aws_cloudfront" "my_distribution" {
  name               = "blog-terraform"
}

resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.primary.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.my_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.my_distribution.zone_id
    evaluate_target_health = true
  }
}