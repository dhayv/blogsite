terraform {
    required_providers {
      aws = {
        source = "hashicorp/aws",
        version = "5.76.0"
      }
    }

    required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.aws_region
}


# Data source from route53 zone
data "aws_route53_zone" "selected" {
  name = var.zone_name
  private_zone = false
}

module "origin_access" {
  source = "./modules/blog/originaccess"
  domain_name = var.domain_name
}

module "s3_bucket" {
  source = "./modules/blog/s3"
  domain_name = var.domain_name
  origin_access_control_id = module.origin_access.origin_access_control_id
} 


module "acm" {
  source = "./modules/blog/acm"
  domain_name = var.domain_name
  zone_id = data.aws_route53_zone.selected.zone_id
}

module "cloudfront" {
  source = "./modules/blog/cloudfront"
  domain_name = var.domain_name
  acm_certificate_arn = module.acm.certificate_arn
  origin_access_control_id = module.origin_access.origin_access_control_id
  bucket_name = module.s3_bucket.bucket_name
}

module "route53" {
  source = "./modules/blog/route53"
  domain_name = var.domain_name
  cloudfront_distribution_domain_name = module.cloudfront.distribution_domain_name
  cloudfront_distribution_hosted_zone_id = module.cloudfront.distribution_hosted_zone_id
  zone_id = data.aws_route53_zone.selected.zone_id

}


output "s3_bucket_name" {
  value = module.s3_bucket.bucket_name
}