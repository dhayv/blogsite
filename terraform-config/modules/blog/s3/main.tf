resource "aws_s3_bucket" "blog" {
  
  bucket = var.domain_name

  tags = {
    Name = "My blog bucket"
  }

}



resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.blog.id
  versioning_configuration {
    status = "Enabled"
  }
}

locals {
    s3_origin_id = "myS3Origin"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "policy" {
  bucket = aws_s3_bucket.blog.id
  policy = data.aws_iam_policy_document.bucket_policy.json
}

data "aws_iam_policy_document" "bucket_policy" {
  statement {
    sid    = "AllowCloudFrontServicePrincipalReadOnly"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:GetObject"]

    resources = ["${aws_s3_bucket.blog.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      values   = [var.distribution_arn]
    }
  }
}


resource "aws_s3_bucket_website_configuration" "blog" {
  bucket = aws_s3_bucket.blog.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }

}