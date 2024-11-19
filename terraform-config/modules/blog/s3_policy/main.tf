variable "bucket_arn" {
  type = string
}

variable "origin_access_identity_arn" {
  type = string
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${var.bucket_arn}/*"]

    principals {
      type        = "AWS"
      identifiers = [var.origin_access_identity_arn]
    }
  }
}