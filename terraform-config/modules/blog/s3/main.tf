resource "aws_s3_bucket" "blog" {
  
  bucket = var.domain_name

  tags = {
    Name = "My blog bucket"
  }

}



resource "aws_s3_bucket_acl" "acl" {
  bucket = aws_s3_bucket.blog.id
  
  acl = "private"
  
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

locals {
  oac_arn = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:origin-access-control/${var.origin_access_control_id}"
}

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
      variable = "AWS:SourceArn"
      values   = [local.oac_arn]
    }
  }
}
