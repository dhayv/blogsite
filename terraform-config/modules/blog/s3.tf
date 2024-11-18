module "s3_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = var.domain_name
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  versioning = {
    enabled = true
  } 
}

resource "aws_s3_bucket_website_configuration" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_acl" "s3_bucket" {
  bucket = aws_s3_bucket.s3_bucket.id

  acl = "private"
}

locals {
    mime_types = {
      ".html" = "text/html"
      ".png"  = "image/png"
      ".jpg"  = "image/jpeg"
      ".gif"  = "image/gif"
      ".css"  = "text/css"
      ".js"   = "application/javascript"
    }
}

resource "aws_s3_object" "build" {
  for_each = fileset("../my-app/app/", "**")
  bucket = aws_s3_bucket.www-my-aws-project-com.id
  key = each.value
  source = "../my-app/app/${each.value}"
  etag = filemd5("../my-app/app/${each.value}")
  acl    = "private"
content_type = lookup(local.mime_types, regex("\\.[^.]+$", each.key), null)
}

