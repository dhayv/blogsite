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
}

module "route53" {
  source = "./modules/blog/route53"
  domain_name = var.domain_name

}

module "s3_policy" {
  source = "./modules/blog/s3_policy"
}