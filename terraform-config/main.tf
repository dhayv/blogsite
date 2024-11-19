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
  region = "us-east-1"
}

variable "domain_name" {
  type = string
  
}

module "s3_bucket" {
  source = "./modules/blog/s3"
  domain_name = var.domain_name

} 

module "origin_access" {
  source = "./modules/blog/originaccess"
  domain_name = var.domain_name
}


module "acm" {
  source = "./modules/blog/acm"
  domain_name = var.domain_name
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
  cloudfront_distribution_domain_name = module.cloudfront.my_distribution
  cloudfront_distribution_hosted_zone_id = module.cloudfront.dis
  zone_id = data.aws_route53_zone.selected.zone_id

}

module "s3_policy" {
  source = "./modules/blog/s3_policy"
  origin_access_identity_arn = module.origin_access.origin_access_identity_arn
  bucket_arn = module.s3_bucket.bucket_arn
}