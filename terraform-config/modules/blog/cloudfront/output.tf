// data send to route53 
output "distribution_domain_name" {
  value = aws_cloudfront_distribution.my_distribution.domain_name
}

output "distribution_hosted_zone_id" {
  value = aws_cloudfront_distribution.my_distribution.hosted_zone_id
}

output "distribution_arn" {
  value = aws_cloudfront_distribution.my_distribution.arn
}